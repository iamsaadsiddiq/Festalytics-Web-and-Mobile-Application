import React from 'react';
import { Check, Calendar } from 'lucide-react';

const Timeline = ({ eventData, updateFormData }) => {
    const tasks = eventData.tasks || [];

    const toggleTask = (taskId) => {
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, status: t.status === 'completed' ? 'pending' : 'completed' };
            }
            return t;
        });
        updateFormData('tasks', newTasks);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Timeline & Tasks</h1>
                <p className="text-gray-500">Stay organized with a clear schedule and to-do list.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-gray-200"></div>

                    <div className="space-y-8">
                        {tasks.map((task, index) => (
                            <div key={task.id} className="relative flex items-center gap-6 cursor-pointer" onClick={() => toggleTask(task.id)}>
                                {/* Timeline Node */}
                                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-white z-10 shadow-md transition-colors ${task.status === 'completed' ? 'bg-green-500' : 'bg-white border-2 border-gray-200 text-gray-400'
                                    }`}>
                                    {task.status === 'completed' ? <Check size={24} /> : <span className="text-lg">{index + 1}</span>}
                                </div>

                                {/* Task Card */}
                                <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                    <div>
                                        <h4 className={`font-bold text-lg ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <Calendar size={14} /> Due: {task.due}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {task.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
