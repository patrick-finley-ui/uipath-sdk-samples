import { getLogoUrls } from '../../utils/logoUtils';

export const Header = () => {
  const { dodLogoSrc, uipathLogoSrc } = getLogoUrls();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left: DoD Logo */}
          <div className="flex items-center">
            <img
              src={dodLogoSrc}
              alt="Department of Defense"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Center: App Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl font-bold text-gray-900">Invoice Processing Dashboard</h1>
          </div>

          {/* Right: UiPath Logo */}
          <div className="flex items-center">
            <img
              src={uipathLogoSrc}
              alt="UiPath"
              className="h-28 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
