import React from 'react'
import { Sport, FilterState } from '../../types'
import { FootballIcon, BasketballIcon, BaseballIcon, HockeyIcon, CollegeBasketballIcon } from '../Icons'

interface FiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

const sports: Array<Sport | 'ALL'> = ['ALL', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAMB']

export const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Filter by Sport
          </label>
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => onFilterChange({ ...filters, sport })}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  filters.sport === sport
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {sport === 'NFL' && <FootballIcon />}
                {sport === 'NBA' && <BasketballIcon />}
                {sport === 'MLB' && <BaseballIcon />}
                {sport === 'NHL' && <HockeyIcon />}
                {sport === 'NCAAF' && <FootballIcon />}
                {sport === 'NCAAMB' && <CollegeBasketballIcon />}
                {sport}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Search Teams
          </label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search for a team..."
            className="input"
          />
        </div>
      </div>
    </div>
  )
}
