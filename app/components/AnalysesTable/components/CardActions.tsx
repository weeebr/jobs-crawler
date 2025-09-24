function createButtonClickHandler(
  handler: () => void | Promise<void>
): (e: React.MouseEvent) => void {
  return (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  };
}

export function CardActions({
  currentStatus,
  onStatusToggle,
  onDelete
}: {
  currentStatus?: 'interested' | 'applied';
  onStatusToggle: (status: 'interested' | 'applied') => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-4">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={createButtonClickHandler(() => onStatusToggle("interested"))}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            currentStatus === "interested"
              ? "border-accent-500 bg-accent-50 text-accent-700"
              : "border-neutral-300 text-neutral-600 hover:border-accent-400 hover:text-accent-600"
          }`}
        >
          Interested
        </button>
        <button
          type="button"
          onClick={createButtonClickHandler(() => onStatusToggle("applied"))}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            currentStatus === "applied"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-600"
          }`}
        >
          Applied
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={createButtonClickHandler(onDelete)}
          className="text-xs text-error-600 hover:text-error-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}