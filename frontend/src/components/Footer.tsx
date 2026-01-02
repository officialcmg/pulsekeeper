import { File, Code2, Heart, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700/30 py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Heart className="h-4 w-4 text-primary-500" />
            <span>PulseKeeper - Powered by MetaMask Advanced Permissions</span>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="https://docs.metamask.io/smart-accounts-kit/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors duration-200"
            >
              <File className="h-4 w-4" />
              <span className="text-sm">Docs</span>
            </a>
            <a
              href="https://docs.metamask.io/smart-accounts-kit/guides/advanced-permissions/execute-on-metamask-users-behalf/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors duration-200"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm">Permissions Guide</span>
            </a>
            <a
              href="https://github.com/metamask/gator-examples"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors duration-200"
            >
              <Code2 className="h-4 w-4" />
              <span className="text-sm">Examples</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
