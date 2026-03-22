export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[300]">
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className="flex items-center gap-3 bg-vault-surface border border-vault-border
                     rounded-xl px-4 py-3 text-sm shadow-2xl cursor-pointer animate-slideUp">
          {t.message}
        </div>
      ))}
    </div>
  );
}
