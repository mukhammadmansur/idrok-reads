import type { AccountSession, api, ChildProfile, ProgressEvent } from "./api";
import {
  getActiveLocalProfileId,
  getLocalProfiles,
  saveLocalProfiles,
  type LocalChildProfile,
} from "./localProfiles";
import { eventId } from "./outbox";
import { stories, generalQuiz } from "../content/stories";

export interface MergeResult {
  mergedProfilesCount: number;
  activeChildName: string;
  toastMessage: string | null;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function progressToEvents(profile: LocalChildProfile): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  const progress = profile.progress;
  if (!progress) return events;

  // Theme event
  if (progress.theme && progress.theme !== "classic") {
    events.push({
      id: eventId(),
      type: "theme",
      theme: progress.theme,
    });
  }

  // Reading events
  if (progress.reading) {
    for (const [storyId, record] of Object.entries(progress.reading)) {
      const story = stories.find((s) => s.id === storyId);
      if (!story) continue;
      const lastPage = story.pages.length - 1;
      const page = Math.min(record.page, lastPage);

      if (record.completedAt) {
        events.push({
          id: eventId(),
          type: "reading",
          storyId,
          page: lastPage,
          complete: true,
        });
      }
      if (!record.completedAt || page !== lastPage) {
        events.push({
          id: eventId(),
          type: "reading",
          storyId,
          page,
          complete: false,
        });
      }
    }
  }

  // Quiz events
  if (progress.quizzes) {
    for (const [quizId, record] of Object.entries(progress.quizzes)) {
      const questions =
        quizId === "general"
          ? generalQuiz
          : stories.find((s) => s.id === quizId)?.quiz;
      if (!questions || !questions.length) continue;

      const targetScore = Math.min(record.score, questions.length);
      const answers: number[] = questions.map((q, idx) => {
        if (idx < targetScore) {
          return q.answer;
        }
        // Choose an incorrect option
        return (q.answer + 1) % (q.options.length || 1);
      });

      events.push({
        id: eventId(),
        type: "quiz",
        quizId,
        answers,
      });
    }
  }

  return events;
}

export async function executeBackgroundAutoMerge(
  session: AccountSession,
  apiClient: Pick<
    typeof api,
    "createChild" | "updateChild" | "selectChild" | "events" | "progress"
  >,
): Promise<MergeResult> {
  const user = session.user;
  if (!user) {
    return { mergedProfilesCount: 0, activeChildName: "", toastMessage: null };
  }

  const localProfiles = getLocalProfiles();
  const unsyncedProfiles = localProfiles.filter(
    (p) => p.syncedToParentId !== user.id,
  );

  if (unsyncedProfiles.length === 0) {
    return { mergedProfilesCount: 0, activeChildName: "", toastMessage: null };
  }

  let serverChildren: ChildProfile[] = [...session.children];
  let mergedCount = 0;
  const mergedNames: string[] = [];
  const mergedLocalIds = new Set<string>();
  const activeLocalId = getActiveLocalProfileId();
  let serverSelectedId = session.selectedChildId;

  for (const local of unsyncedProfiles) {
    const normLocal = normalizeName(local.name);
    let targetServerChild: ChildProfile | undefined;

    // Case 1: Placeholder replacement
    // If server only has 1 child named "Kitobxon" or "Mehmon" and local profile has a real name
    if (
      serverChildren.length === 1 &&
      ["kitobxon", "mehmon kitobxon", "mehmon"].includes(
        normalizeName(serverChildren[0].name),
      ) &&
      !["kitobxon", "mehmon kitobxon", "mehmon"].includes(normLocal)
    ) {
      try {
        const placeholder = serverChildren[0];
        const updatedSession = await apiClient.updateChild(placeholder.id, {
          name: local.name,
          avatar: local.avatarId as any,
        });
        serverChildren = updatedSession.children;
        targetServerChild = serverChildren.find((c) => c.id === placeholder.id);
      } catch {
        // Fall back to name match or create
      }
    }

    // Case 2: Name match
    if (!targetServerChild) {
      targetServerChild = serverChildren.find(
        (c) => normalizeName(c.name) === normLocal,
      );
    }

    // Case 3: Create new child profile on server (up to 6 total)
    if (!targetServerChild && serverChildren.length < 6) {
      try {
        const createdSession = await apiClient.createChild(
          local.name,
          local.avatarId as any,
        );
        serverChildren = createdSession.children;
        targetServerChild = serverChildren.find(
          (c) => normalizeName(c.name) === normLocal,
        );
      } catch {
        // Continue if creation fails
      }
    }

    // Merge progress & quizzes into the target child
    if (targetServerChild) {
      const events = progressToEvents(local);
      if (events.length > 0) {
        try {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < events.length; i += CHUNK_SIZE) {
            const chunk = events.slice(i, i + CHUNK_SIZE);
            await apiClient.events(targetServerChild.id, chunk);
          }
        } catch {
          // Keep unsynced flag so it can retry later
          continue;
        }
      }

      if (local.id === activeLocalId) {
        serverSelectedId = targetServerChild.id;
      }

      mergedCount++;
      mergedNames.push(local.name);
      mergedLocalIds.add(local.id);
    }
  }

  // Update selected child on server if appropriate
  if (serverSelectedId && serverSelectedId !== session.selectedChildId) {
    try {
      await apiClient.selectChild(serverSelectedId);
    } catch {
      // ignore
    }
  }

  // Mark merged local profiles as synced
  const updatedLocals = localProfiles.map((p) => {
    if (mergedLocalIds.has(p.id)) {
      return { ...p, syncedToParentId: user.id };
    }
    return p;
  });
  saveLocalProfiles(updatedLocals);

  // Generate warm toast message
  let toastMessage: string | null = null;
  if (mergedCount === 1) {
    toastMessage = `${mergedNames[0]}ning natijalari oilangiz hisobiga saqlandi ✓`;
  } else if (mergedCount > 1) {
    toastMessage = "Oilangiz profillari saqlandi ✓";
  }

  return {
    mergedProfilesCount: mergedCount,
    activeChildName: mergedNames[0] || "",
    toastMessage,
  };
}
