import type { PipelineConfig } from '../types'

interface Props {
  onApply: (template: PipelineConfig) => void
  onClose: () => void
}

const TEMPLATES: PipelineConfig[] = [
  {
    name: 'database_sync',
    displayName: 'Database Sync',
    description: 'Synchronize data between two databases',
    icon: '🔄'
  },
  {
    name: 'email_ingestion',
    displayName: 'Email Processing',
    description: 'Process emails and extract attachments',
    icon: '📧'
  },
  {
    name: 'web_scraper',
    displayName: 'Web Scraper',
    description: 'Scrape data from websites',
    icon: '🕷️'
  },
  {
    name: 'ftp_monitor',
    displayName: 'FTP Monitor',
    description: 'Monitor FTP/SFTP for new files',
    icon: '📁'
  },
  {
    name: 'kafka_consumer',
    displayName: 'Kafka Consumer',
    description: 'Consume messages from Kafka topics',
    icon: '📨'
  },
  {
    name: 's3_ingestion',
    displayName: 'S3 Ingestion',
    description: 'Ingest files from AWS S3 buckets',
    icon: '☁️'
  },
  {
    name: 'api_gateway',
    displayName: 'API Gateway',
    description: 'Route and transform API requests',
    icon: '🚪'
  },
  {
    name: 'data_validator',
    displayName: 'Data Validator',
    description: 'Validate data quality and schema',
    icon: '✅'
  },
  {
    name: 'report_generator',
    displayName: 'Report Generator',
    description: 'Generate reports from data sources',
    icon: '📑'
  },
  {
    name: 'ml_pipeline',
    displayName: 'ML Pipeline',
    description: 'Run ML model inference pipeline',
    icon: '🤖'
  }
]

export default function PipelineTemplates({ onApply, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative glass-card border border-[var(--color-spark)]/30 w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold font-mono text-white">
              📋 PIPELINE TEMPLATES
            </h2>
            <p className="text-sm text-[var(--color-dim)] font-mono mt-1">
              Quick-start templates for common ETL tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-dim)] hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map((template, index) => (
              <button
                key={template.name}
                onClick={() => onApply(template)}
                className="glass-card rounded-lg p-4 border border-white/10 hover:border-[var(--color-spark)]/50 transition-all text-left group animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono font-bold text-white text-sm">
                      {template.displayName}
                    </h3>
                    <p className="text-xs text-[var(--color-dim)] mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-[var(--color-spark)] font-mono group-hover:underline">
                    + ADD TEMPLATE
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[var(--color-steel)] hover:bg-[var(--color-concrete)] text-white font-mono py-2 px-6 rounded transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
