export function enableDevToolsProtection() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (
      e.key === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        ["i", "j", "c"].includes(key)) ||
      (e.ctrlKey && key === "u") ||
      (e.metaKey &&
        e.altKey &&
        ["i", "j", "c"].includes(key))
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  document.addEventListener(
    "keydown",
    handleKeyDown,
    true
  );

  document.addEventListener(
    "contextmenu",
    handleContextMenu
  );

  return () => {
    document.removeEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    document.removeEventListener(
      "contextmenu",
      handleContextMenu
    );
  };
}