import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useCreateCommunity } from '../hooks/use-communities';
import { Button, Input } from '@aether/ui'; // Assuming exported from packages/ui

interface CommunityCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityCreationModal: React.FC<CommunityCreationModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isTokenGated, setIsTokenGated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const createCommunity = useCreateCommunity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCommunity.mutateAsync({
        name,
        description,
        isTokenGated,
      });
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setIsTokenGated(false);
      setAvatarUrl('');
    } catch (error) {
      console.error('Failed to create community', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Community</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-indigo-500 transition-colors">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-medium">Upload</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Community Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g. Web3 Builders"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Token Gated</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Require members to hold specific NFTs</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isTokenGated}
              onClick={() => setIsTokenGated(!isTokenGated)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                isTokenGated ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isTokenGated ? 'translate-x-2' : '-translate-x-2'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCommunity.isPending || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {createCommunity.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Community'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
