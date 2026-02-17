import { useState } from 'react';
import type { PipelineRun } from '../types';

interface Props {
  runs: PipelineRun[];
}

export default function PipelineAnalytics({ runs }: Props) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Filter runs by time range
  const now = Date.now();
  const timeRanges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const filteredRuns = runs.filter(r => 
    now - new Date(r.started_at).getTime() < timeRanges[timeRange]
  );

  // Calculate stats
  const successCount = filteredRuns.filter(r => r.status === 'completed' || r.status === 'success').length;
  const failedCount = filteredRuns.filter(r => r.status === 'failed').length;
  const totalCount = filteredRuns.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  // Get unique pipelines
  const pipelines = [...new Set(filteredRuns.map(r => r.pipeline ?? r.pipeline_name))];
  
  // Calculate avg duration
  const completedRuns = filteredRuns.filter(r => r.completed_at && r.started_at);
  const avgDuration = completedRuns.length > 0 
    ? Math.round(completedRuns.reduce((sum, r) => sum + (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()), 0) / completedRuns.length / 1000)
    : 0;

  // Group by hour/day for chart
  const getTimeData = () => {
    const data: Record<string, { success: number; failed: number }> = {};
    
    filteredRuns.forEach(run => {
      const date = new Date(run.started_at);
      let key: string;
      
      if (timeRange === '24h') {
        key = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else {
        key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      
      if (!data[key]) data[key] = { success: 0, failed: 0 };
      if (run.status === 'completed' || run.status === 'success') data[key].success++;
      else if (run.status === 'failed') data[key].failed++;
    });
    
    return Object.entries(data).map(([name, values]) => ({
      name,
      ...values
    }));
  };

  const timeData = getTimeData();

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded font-mono text-sm transition-all ${
              timeRange === range
                ? 'bg-[var(--color-spark)] text-black'
                : 'bg-[var(--color-steel)] text-[var(--color-dim)] hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4 border border-[var(--color-spark)]/30 bg-[var(--color-spark)]/5">
          <div className="text-xs font-mono text-[var(--color-dim)] uppercase mb-1">Total Runs</div>
          <div className="text-2xl font-bold font-mono text-[var(--color-spark)]">{totalCount}</div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-green-500/30 bg-green-500/5">
          <div className="text-xs font-mono text-green-400 uppercase mb-1">Success</div>
          <div className="text-2xl font-bold font-mono text-green-400">{successCount}</div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-red-500/30 bg-red-500/5">
          <div className="text-xs font-mono text-red-400 uppercase mb-1">Failed</div>
          <div className="text-2xl font-bold font-mono text-red-400">{failedCount}</div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="text-xs font-mono text-yellow-400 uppercase mb-1">Avg Duration</div>
          <div className="text-2xl font-bold font-mono text-yellow-400">{avgDuration}s</div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="glass-card rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-white">SUCCESS RATE</h3>
          <span className={`font-mono text-2xl font-bold ${
            successRate >= 80 ? 'text-green-400' : 
            successRate >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {successRate}%
          </span>
        </div>
        <div className="h-3 bg-[var(--color-void)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="glass-card rounded-lg p-6 border border-white/10">
        <h3 className="font-mono text-white mb-4">PIPELINE BREAKDOWN</h3>
        <div className="space-y-3">
          {pipelines.map(pipeline => {
            const pipelineRuns = filteredRuns.filter(r => (r.pipeline ?? r.pipeline_name) === pipeline);
            const success = pipelineRuns.filter(r => r.status === 'completed' || r.status === 'success').length;
            // failed count not displayed but could be added
            const rate = pipelineRuns.length > 0 ? Math.round((success / pipelineRuns.length) * 100) : 0;
            
            return (
              <div key={pipeline} className="flex items-center gap-4">
                <div className="w-32 font-mono text-sm text-[var(--color-dim)] truncate">
                  {pipeline}
                </div>
                <div className="flex-1 h-2 bg-[var(--color-void)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="w-20 text-right font-mono text-sm text-white">
                  {success}/{pipelineRuns.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Chart */}
      {timeData.length > 0 && (
        <div className="glass-card rounded-lg p-6 border border-white/10">
          <h3 className="font-mono text-white mb-4">RUNS TIMELINE</h3>
          <div className="flex items-end gap-1 h-32">
            {timeData.map((data, i) => {
              const max = Math.max(data.success, data.failed, 1);
              const successHeight = (data.success / max) * 100;
              const failedHeight = (data.failed / max) * 100;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 h-24">
                    <div 
                      className="flex-1 bg-green-500/70 rounded-t transition-all hover:bg-green-500"
                      style={{ height: `${successHeight}%` }}
                      title={`${data.success} successful`}
                    />
                    <div 
                      className="flex-1 bg-red-500/70 rounded-t transition-all hover:bg-red-500"
                      style={{ height: `${failedHeight}%` }}
                      title={`${data.failed} failed`}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-dim)] transform -rotate-45 origin-top-left whitespace-nowrap">
                    {data.name}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs font-mono">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-green-400">Success</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-red-400">Failed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
