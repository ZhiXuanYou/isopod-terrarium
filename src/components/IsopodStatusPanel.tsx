import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SATIETY, type IsopodState } from '../game/isopodConfig'
import { validateIsopodName } from '../game/isopodIdentity'

const STATE_LABELS: Record<IsopodState, string> = {
  IDLE: '休息中',
  WANDERING: '閒晃中',
  MOVING_TO_FOOD: '前往食物',
  AT_FOOD: '進食中',
  ROLLING: '縮成球中',
  ROLLED: '縮成球',
  UNROLLING: '展開中',
}

interface IsopodStatusPanelProps {
  displayName: string
  speciesChineseName: string
  speciesEnglishName: string
  customName: string | null
  satiety: number
  state: IsopodState
  onRename: (customName: string) => void
  onClose: () => void
}

function IsopodStatusPanel({
  displayName,
  speciesChineseName,
  speciesEnglishName,
  customName,
  satiety,
  state,
  onRename,
  onClose,
}: IsopodStatusPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function startEditing() {
    setDraftName(customName ?? '')
    setValidationError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraftName('')
    setValidationError(null)
    setIsEditing(false)
  }

  function commitName() {
    const result = validateIsopodName(draftName)

    if (result.error) {
      setValidationError(result.error)
      return
    }

    onRename(result.name)
    setValidationError(null)
    setIsEditing(false)
  }

  function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    commitName()
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commitName()
    }
  }

  return (
    <aside className="status-panel" aria-label={`${displayName} 個體資訊`}>
      <div className="status-panel__heading">
        <div>
          <p className="status-panel__eyebrow">{speciesChineseName}</p>
          <h2>{displayName}</h2>
        </div>
        <button
          className="status-panel__close"
          type="button"
          onClick={onClose}
          aria-label="關閉個體資訊"
        >
          ×
        </button>
      </div>

      {isEditing ? (
        <form className="naming-editor" onSubmit={submitName} noValidate>
          <label className="naming-editor__label" htmlFor="isopod-name-input">
            名字
          </label>
          <input
            id="isopod-name-input"
            className="naming-editor__input"
            type="text"
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value)
              setValidationError(null)
            }}
            onKeyDown={handleInputKeyDown}
            aria-invalid={validationError ? 'true' : 'false'}
            aria-describedby={validationError ? 'isopod-name-error' : undefined}
            autoFocus
          />
          {validationError && (
            <p id="isopod-name-error" className="naming-editor__error" role="alert">
              {validationError}
            </p>
          )}
          <div className="naming-editor__actions">
            <button className="status-action-button" type="button" onClick={cancelEditing}>
              取消
            </button>
            <button className="status-action-button status-action-button--primary" type="submit">
              確認
            </button>
          </div>
        </form>
      ) : (
        <button className="status-panel__rename" type="button" onClick={startEditing}>
          {customName ? '重新命名' : '取名字'}
        </button>
      )}

      <dl className="status-panel__details">
        <div>
          <dt>物種</dt>
          <dd>{speciesEnglishName}</dd>
        </div>
        <div>
          <dt>目前狀態</dt>
          <dd data-status-state={state}>{STATE_LABELS[state]}</dd>
        </div>
      </dl>

      <div className="status-panel__satiety">
        <div className="status-panel__satiety-label">
          <span>飽食度</span>
          <strong>{satiety} / {SATIETY.max}</strong>
        </div>
        <div
          className="satiety-bar"
          role="progressbar"
          aria-label={`${displayName} 飽食度`}
          aria-valuemin={SATIETY.min}
          aria-valuemax={SATIETY.max}
          aria-valuenow={satiety}
        >
          <span className="satiety-bar__fill" style={{ width: `${satiety}%` }} />
        </div>
      </div>
    </aside>
  )
}

export default IsopodStatusPanel
