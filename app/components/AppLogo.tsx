import Link from "next/link";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  const baseClasses =
    "flex items-center space-x-2 sm:space-x-3 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <Link href="/" className={combinedClasses}>
      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-xs">JC</span>
      </div>
      <div className="hidden sm:block">
        <h1 className="text-sm sm:text-base font-semibold text-gray-900 leading-none">Jobs Crawler</h1>
        <p className="text-xs text-gray-600 leading-none mt-0.5">Truthful career intelligence</p>
      </div>
      <div className="sm:hidden">
        <h1 className="text-sm font-semibold text-gray-900 leading-none whitespace-nowrap">Jobs Crawler</h1>
      </div>
    </Link>
  );
}

