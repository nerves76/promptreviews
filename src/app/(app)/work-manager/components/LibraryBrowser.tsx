'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import LibraryTaskCard from './LibraryTaskCard';
import LibraryTaskPreview from './LibraryTaskPreview';
import {
  WMLibraryTask,
  WMLibraryPack,
  WMLibraryCategory,
  WMLibraryDifficulty,
  WMLibraryTimeEstimate,
  WM_LIBRARY_CATEGORIES,
  WM_LIBRARY_DIFFICULTY,
  WM_LIBRARY_TIME_ESTIMATES,
} from '@/types/workManager';

interface LibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

type NavigationItem =
  | { type: 'all' }
  | { type: 'category'; id: WMLibraryCategory }
  | { type: 'pack'; id: string };

export default function LibraryBrowser({ isOpen, onClose, onTaskAdded }: LibraryBrowserProps) {
  // Data state
  const [packs, setPacks] = useState<WMLibraryPack[]>([]);
  const [tasks, setTasks] = useState<WMLibraryTask[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Navigation state
  const [selectedNav, setSelectedNav] = useState<NavigationItem>({ type: 'all' });
  const [selectedPack, setSelectedPack] = useState<WMLibraryPack | null>(null);

  // Filter state
  const [difficultyFilter, setDifficultyFilter] = useState<WMLibraryDifficulty | ''>('');
  const [timeFilter, setTimeFilter] = useState<WMLibraryTimeEstimate | ''>('');

  // Preview state
  const [previewTask, setPreviewTask] = useState<WMLibraryTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingPack, setIsAddingPack] = useState(false);

  // Fetch packs on mount
  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  // Fetch tasks when navigation or filters change
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, selectedNav, difficultyFilter, timeFilter]);

  const fetchPacks = async () => {
    setIsLoadingPacks(true);
    try {
      const response = await apiClient.get<{ packs: WMLibraryPack[] }>('/work-manager/library/packs');
      setPacks(response.packs || []);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const params = new URLSearchParams();

      if (selectedNav.type === 'category') {
        params.set('category', selectedNav.id);
      } else if (selectedNav.type === 'pack') {
        params.set('pack_id', selectedNav.id);
      }

      if (difficultyFilter) {
        params.set('difficulty', difficultyFilter);
      }
      if (timeFilter) {
        params.set('time_estimate', timeFilter);
      }

      const url = `/work-manager/library/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<{ tasks: WMLibraryTask[] }>(url);
      setTasks(response.tasks || []);

      // Also fetch pack details if a pack is selected
      if (selectedNav.type === 'pack') {
        const packResponse = await apiClient.get<{ pack: WMLibraryPack }>(`/work-manager/library/packs/${selectedNav.id}`);
        setSelectedPack(packResponse.pack);
      } else {
        setSelectedPack(null);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleNavSelect = (nav: NavigationItem) => {
    setSelectedNav(nav);
    // Clear filters when changing navigation
    setDifficultyFilter('');
    setTimeFilter('');
  };

  const handleAddTask = async (task: WMLibraryTask) => {
    setIsAddingTask(true);
    try {
      await apiClient.post('/work-manager/tasks/from-library', {
        library_task_id: task.id,
      });
      onTaskAdded();
      setPreviewTask(null);
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleAddPack = async () => {
    if (!selectedPack) return;

    setIsAddingPack(true);
    try {
      const response = await apiClient.post<{ count: number }>('/work-manager/tasks/from-pack', {
        pack_id: selectedPack.id,
      });
      onTaskAdded();
      // Show success message
      alert(`Added ${response.count} tasks to your board!`);
    } catch (error) {
      console.error('Error adding pack:', error);
    } finally {
      setIsAddingPack(false);
    }
  };

  const getNavLabel = () => {
    if (selectedNav.type === 'all') return 'All tasks';
    if (selectedNav.type === 'category') {
      const cat = WM_LIBRARY_CATEGORIES.find(c => c.id === selectedNav.id);
      return cat?.label || selectedNav.id;
    }
    if (selectedNav.type === 'pack') {
      return selectedPack?.name || 'Pack';
    }
    return 'Tasks';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl h-[85vh] bg-white rounded-xl shadow-2xl flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Task library</h2>
                    <p className="text-sm text-gray-500 mt-1">Browse SEO & AI tasks</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Packs section */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Packs</h3>
                      <div className="space-y-1">
                        {isLoadingPacks ? (
                          <div className="text-sm text-gray-400 py-2">Loading...</div>
                        ) : packs.length === 0 ? (
                          <div className="text-sm text-gray-400 py-2">No packs available</div>
                        ) : (
                          packs.map(pack => (
                            <button
                              key={pack.id}
                              onClick={() => handleNavSelect({ type: 'pack', id: pack.id })}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                selectedNav.type === 'pack' && selectedNav.id === pack.id
                                  ? 'bg-slate-blue text-white'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pack.icon && <Icon name={pack.icon as any} size={14} />}
                              <span className="flex-1 truncate">{pack.name}</span>
                              {pack.task_count !== undefined && (
                                <span className={`text-xs ${
                                  selectedNav.type === 'pack' && selectedNav.id === pack.id
                                    ? 'text-white/70'
                                    : 'text-gray-400'
                                }`}>
                                  {pack.task_count}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Categories section */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categories</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleNavSelect({ type: 'all' })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedNav.type === 'all'
                              ? 'bg-slate-blue text-white'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All tasks
                        </button>
                        {WM_LIBRARY_CATEGORIES.map(category => (
                          <button
                            key={category.id}
                            onClick={() => handleNavSelect({ type: 'category', id: category.id as WMLibraryCategory })}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedNav.type === 'category' && selectedNav.id === category.id
                                ? 'bg-slate-blue text-white'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getNavLabel()}</h3>
                      {selectedPack?.description && (
                        <p className="text-sm text-gray-500 mt-1">{selectedPack.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Filters */}
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value as WMLibraryDifficulty | '')}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                      >
                        <option value="">All difficulties</option>
                        {WM_LIBRARY_DIFFICULTY.map(d => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as WMLibraryTimeEstimate | '')}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                      >
                        <option value="">All times</option>
                        {WM_LIBRARY_TIME_ESTIMATES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>

                      {/* Add pack button */}
                      {selectedPack && tasks.length > 0 && (
                        <button
                          onClick={handleAddPack}
                          disabled={isAddingPack}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-blue/90 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-slate-blue transition-all disabled:opacity-50 shadow-lg whitespace-nowrap"
                        >
                          {isAddingPack ? (
                            <>
                              <Icon name="FaSpinner" size={14} className="animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Icon name="FaPlus" size={14} />
                              Add all {tasks.length} tasks
                            </>
                          )}
                        </button>
                      )}

                      {/* Close button */}
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Icon name="FaTimes" size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Task grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingTasks ? (
                      <div className="flex items-center justify-center py-12">
                        <Icon name="FaSpinner" size={24} className="animate-spin text-gray-400" />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon name="FaInbox" size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No tasks found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedNav.type === 'pack'
                            ? 'This pack has no tasks yet'
                            : 'Try adjusting your filters'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map(task => (
                          <LibraryTaskCard
                            key={task.id}
                            task={task}
                            onClick={setPreviewTask}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Task preview sidebar */}
                {previewTask && (
                  <div className="w-96 border-l border-gray-200 bg-white">
                    <LibraryTaskPreview
                      task={previewTask}
                      onClose={() => setPreviewTask(null)}
                      onAddToBoard={handleAddTask}
                      isAdding={isAddingTask}
                    />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
