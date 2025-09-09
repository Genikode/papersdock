interface Props {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<Props> = ({
  title,
  description,
  onCancel,
  onConfirm,
}) => (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
  <div className="w-full max-w-md rounded-xl p-6 shadow-xl
                  bg-white dark:bg-slate-900
                  border border-slate-200 dark:border-slate-800">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">{description}</p>

    <div className="flex justify-end gap-2 mt-4">
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded border
                   border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   hover:bg-slate-50 dark:hover:bg-slate-800
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                   focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-4 py-2 rounded text-white
                   bg-red-600 hover:bg-red-700
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                   focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        Confirm
      </button>
    </div>
  </div>
</div>

);

export default ConfirmationModal;
