export async function copyToClipboard(
  text: string,
  onSuccess: () => void,
  onError: (message: string) => void
): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard API unavailable");
    }
    await navigator.clipboard.writeText(text);
    onSuccess();
  } catch (error) {
    console.warn("[copyService] copy failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "Copy failed. Select manually.";
    onError(message);
  }
}
