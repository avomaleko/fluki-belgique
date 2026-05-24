import { supabase } from "@/integrations/supabase/client";
import { deleteStorageObject } from "@/lib/storage";

export type DeletableTrack = {
  id: string;
  pdf_path: string | null;
  audio_path: string | null;
  image_paths: string[] | null;
};

/**
 * Deletes a track row and all associated storage objects (PDF, audio, images).
 * Storage cleanup is best-effort: errors there are ignored so the row removal still succeeds.
 */
export async function deleteTrackAndAssets(track: DeletableTrack): Promise<void> {
  const cleanups: Promise<void>[] = [];
  if (track.pdf_path) cleanups.push(deleteStorageObject("pdfs", track.pdf_path));
  if (track.audio_path) cleanups.push(deleteStorageObject("audios", track.audio_path));
  (track.image_paths ?? []).forEach((p) => cleanups.push(deleteStorageObject("images", p)));
  await Promise.allSettled(cleanups);

  const { error } = await supabase.from("tracks").delete().eq("id", track.id);
  if (error) throw error;
}
