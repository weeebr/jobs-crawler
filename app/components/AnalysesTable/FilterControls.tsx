import type { FilterState } from "@/lib/clientStorage";
import type { DynamicOptions } from "./types";
import { SCORE_FILTERS, STATUS_FILTERS, SORT_OPTIONS } from "./types";

interface FilterControlsProps {
  filters: FilterState;
  dynamicOptions: DynamicOptions;
  onFilterChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  isVisible: boolean;
}

export function FilterControls({ filters, dynamicOptions, onFilterChange, isVisible }: FilterControlsProps) {
  return (
    <div className="w-full">
      <div className={`filter-grid transition-all duration-300 ${
        isVisible ? 'opacity-100 max-h-96' : 'opacity-0 h-0 overflow-hidden'
      }`}>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Sort by</label>
        <select
          value={filters.sort}
          onChange={(event) => onFilterChange('sort', event.target.value as FilterState['sort'])}
          className="input-field text-sm"
          title="Sort analyses by"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Max team size</label>
        <select
          value={filters.size}
          onChange={(event) => onFilterChange('size', event.target.value)}
          className="input-field text-sm"
          title="Filter by team size"
        >
          <option value="all">All sizes</option>
          {dynamicOptions.sizes.map((size: string) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Match score</label>
        <select
          value={filters.score}
          onChange={(event) => onFilterChange('score', event.target.value)}
          className="input-field text-sm"
          title="Filter by match score"
        >
          {SCORE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Location</label>
        <select
          value={filters.location}
          onChange={(event) => onFilterChange('location', event.target.value)}
          className="input-field text-sm"
          title="Filter by location"
        >
          <option value="all">All locations</option>
          {dynamicOptions.locations.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Technology</label>
        <select
          value={filters.tech}
          onChange={(event) => onFilterChange('tech', event.target.value)}
          className="input-field text-sm"
          title="Filter by technology"
        >
          <option value="all">All tech</option>
          {dynamicOptions.tech.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
        <select
          value={filters.status}
          onChange={(event) => onFilterChange('status', event.target.value as FilterState['status'])}
          className="input-field text-sm"
          title="Filter by application status"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="col-span-full">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Search</label>
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onFilterChange('search', event.target.value)}
          placeholder="Search job titles, companies, technologies, benefits, qualifications..."
          className="input-field text-sm w-full"
          title="Search across job titles, companies, technologies, benefits, qualifications, and more"
        />
      </div>
      </div>
    </div>
  );
}
