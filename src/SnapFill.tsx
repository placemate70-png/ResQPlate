import { useSnapFill } from './useSnapFill'
import type { FoodAnalysis } from './snapFillService'
export function SnapFill({onPhoto,onApply}: {onPhoto:(photo: File | null)=>void; onApply:(result:FoodAnalysis)=>void}) {
  const state=useSnapFill()
  return <div className="upload-panel snapfill-panel"><span className="snapfill-badge">AI assisted</span><h3>Snap your food</h3>
    <p>Suggestions assist data entry. A photo cannot verify food safety, temperature or preparation time. You must review every estimate.</p>
    <label className="snapfill-drop" htmlFor="snapfill-image"><span>Choose a clear food photo</span><small>JPEG, PNG or WebP · up to 5 MB</small></label>
    <input className="sr-only" id="snapfill-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={state.pending} onChange={event=>{
      const photo=event.target.files?.[0]??null
      onPhoto(state.select(photo))
    }} />
    <button className="button-secondary" type="button" disabled={!state.photo || state.pending} onClick={()=>void state.analyze()}>{state.pending ? 'Analyzing photo…' : 'Analyze with SnapFill'}</button>
    {state.pending && <p role="status">Analyzing your photo securely. You can continue editing the form.</p>}
    {state.error && <p role="alert">{state.error}</p>}
    {state.result && (state.result.is_food ? <div className="route-panel"><strong>AI estimate · {Math.round(state.result.confidence*100)}% model confidence (not safety confidence)</strong>
      <p>{state.result.food_name??'Food name unknown'} · {state.result.food_category??'Category unknown'}</p>
      <p>Quantity: {state.result.estimated_quantity??'Unknown'} {state.result.quantity_unit??''} · Estimated servings: {state.result.estimated_servings??'Unknown'}</p>
      {state.result.packaging && <p>Visible packaging: {state.result.packaging}</p>}
      {state.result.visible_freshness_notes && <p>{state.result.visible_freshness_notes}</p>}
      <button className="button-secondary" type="button" onClick={()=>onApply(state.result!)}>Use estimates in form</button><p>This replaces the suggested fields below. Review and edit them before submitting.</p>
    </div> : <p role="status">No identifiable food was found. Select another photo or continue manually.</p>)}
  </div>
}
