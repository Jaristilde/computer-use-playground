import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import { useComputerUse } from './hooks/useComputerUse'

const DEFAULT_PROMPT = 'Check the latest OpenAI news on bing.com.'

function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [currentUrl, setCurrentUrl] = useState('https://example.com')
  const [screenshotBase64, setScreenshotBase64] = useState<string>()
  const [screenshotPreview, setScreenshotPreview] = useState<string>()

  const { state, loading, error, step, reset } = useComputerUse()

  const handleStart = async () => {
    await step({ prompt })
  }

  const handleContinue = async () => {
    if (!state.responseId || !state.computerCall || !screenshotBase64) return
    await step({
      previousResponseId: state.responseId,
      callId: state.computerCall.call_id,
      screenshotBase64,
      currentUrl,
      acknowledgedSafetyChecks: state.computerCall.pending_safety_checks ?? [],
    })
  }

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT)
    setCurrentUrl('https://example.com')
    setScreenshotBase64(undefined)
    setScreenshotPreview(undefined)
    reset()
  }

  const disableContinue = useMemo(() => {
    return !state.computerCall || !screenshotBase64 || loading
  }, [state.computerCall, screenshotBase64, loading])

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setScreenshotPreview(result)
      const [, base64] = result.split(',')
      setScreenshotBase64(base64)
    }
    reader.readAsDataURL(file)
  }, [])

  return (
    <div className="app">
      <header>
        <div>
          <p className="eyebrow">Prototype</p>
          <h1>OpenAI Computer Use Playground</h1>
          <p className="lede">
            Iterate through computer-call actions by submitting prompts and feeding back screenshots.
          </p>
        </div>
        <button className="ghost" onClick={handleReset} disabled={loading}>
          Reset session
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>1. Define task</h2>
          <small>First request includes only the prompt.</small>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
        <div className="panel-actions">
          <button onClick={handleStart} disabled={loading}>
            {loading ? 'Sending…' : 'Start session'}
          </button>
        </div>
        <div className="field-group">
          <label htmlFor="url">Current URL (optional, improves safety checks)</label>
          <input
            id="url"
            type="url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>2. Upload environment screenshot</h2>
          <small>Subsequent requests send the latest screenshot.</small>
        </div>
        <input type="file" accept="image/png,image/jpeg" onChange={onFileChange} />
        {screenshotPreview && (
          <img className="screenshot" src={screenshotPreview} alt="Uploaded screenshot preview" />
        )}
        <div className="panel-actions">
          <button onClick={handleContinue} disabled={disableContinue}>
            {loading ? 'Sending…' : 'Send follow-up step'}
          </button>
        </div>
        <p className="hint">
          Ensure the screenshot reflects the action requested in the previous computer call before uploading.
        </p>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Latest computer call</h2>
            <small>Includes pending safety checks when present.</small>
          </div>
          {state.computerCall ? (
            <>
              <div className="call-row">
                <span className="badge">{state.computerCall.action.type}</span>
                <code className="call-id">{state.computerCall.call_id}</code>
              </div>
              <pre className="code-block">
                {JSON.stringify(state.computerCall.action, null, 2)}
              </pre>
              {!!state.computerCall.pending_safety_checks?.length && (
                <div className="safety">
                  <h3>Pending safety checks</h3>
                  <ul>
                    {state.computerCall.pending_safety_checks.map((check) => (
                      <li key={check.id}>
                        <strong>{check.code}</strong>: {check.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p>No computer call yet. Start a session to receive actions.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Responses</h2>
            <small>Raw payload from the OpenAI Responses API.</small>
          </div>
          {state.log.length === 0 ? (
            <p>No responses yet.</p>
          ) : (
            <pre className="code-block small">
              {JSON.stringify(state.log[state.log.length - 1], null, 2)}
            </pre>
          )}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default App
