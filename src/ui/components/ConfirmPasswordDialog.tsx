import { useState } from 'react';
/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from 'react-i18next';

type ConfirmPasswordDialogProps = {
  username: string;
  propertiesCount: number;
  onConfirm: (password: string) => void;
  onCancel: () => void;
};

/**
 * Modal asking for password confirmation before deleting a user and related data.
 */
export function ConfirmPasswordDialog({
  username,
  propertiesCount,
  onConfirm,
  onCancel,
}: ConfirmPasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!password.trim()) {
      setError(t("deleteUser.passwordRequired"));
      return;
    }
    onConfirm(password);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          {t('deleteUser.title')}
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            {t('deleteUser.confirmMessage', { username })}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              {t('deleteUser.willDelete')}:
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• {t('deleteUser.userProfile')}</li>
              <li>• {t('deleteUser.propertiesCount', { count: propertiesCount })}</li>
              {!showDetails && (
                <li>• {t('deleteUser.moreData')}</li>
              )}
            </ul>
            
            {showDetails && (
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• {t('deleteUser.allTenants')}</li>
                <li>• {t('deleteUser.allLeases')}</li>
                <li>• {t('deleteUser.allPayments')}</li>
              </ul>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-red-600 hover:text-red-800 font-medium mt-2 underline"
            >
              {showDetails ? t('deleteUser.showLess') : t('deleteUser.showMore')}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('deleteUser.confirmPasswordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder={t('deleteUser.passwordPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-3 font-semibold">
            {t('deleteUser.irreversible')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {t('deleteUser.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
