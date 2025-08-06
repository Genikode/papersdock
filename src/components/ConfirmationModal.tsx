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
  <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmationModal;
