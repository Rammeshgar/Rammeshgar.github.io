// A local teaching example. This reproduces the policy's selected outcomes, not SMTP or live checks.
const steps=[
  {minute:600,status:'FAIL',check:'Converter returned an unexpected amount.'},
  {minute:615,status:'FAIL',check:'The same converter check is still failing.'},
  {minute:660,status:'FAIL',check:'The same converter check is still failing.'},
  {minute:1080,status:'PASS',check:'The converter now passes the selected assertion.'},
  {minute:1095,status:'FAIL',check:'A new failure was recorded after the alert window.'}
];
const windowStart=4*60,windowEnd=17*60,cooldown=60;
let lastSent=null;
for(const step of steps){
  if(step.status==='PASS'){
    step.mail=lastSent===null?'none':'recovery';step.reason=lastSent===null?'No prior failure notification is outstanding.':'A previous failure email was sent; recovery is eligible outside the failure window.';
  }else if(step.minute<windowStart||step.minute>=windowEnd){
    step.mail='none';step.reason='Outside the configured failure notification window. The failed run still stays recorded.';
  }else if(lastSent===null){step.mail='failure';step.reason='First failure within the notification window; no prior failure email.';}
  else if(step.minute-lastSent>=cooldown){step.mail='reminder';step.reason='At least 60 minutes have passed since the last failure notification.';}
  else{step.mail='none';step.reason='Within the 60-minute reminder cooldown. The failure remains recorded.';}
  if(step.mail==='recovery')lastSent=null;else if(step.mail==='failure'||step.mail==='reminder')lastSent=step.minute;
}
const labels={none:'NO EMAIL',failure:'FAILURE',reminder:'REMINDER',recovery:'RECOVERY'};
const element=document.getElementById('alert-example');
if(element){
  const controls=[...element.querySelectorAll('button[data-incident]')];
  function show(index){
    const step=steps[index];if(!step)return;
    element.dataset.result=step.status.toLowerCase();element.dataset.mail=step.mail;element.dataset.incident=String(index);
    controls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    document.getElementById('incident-result').textContent=step.status;
    document.getElementById('incident-check').textContent=step.check;
    document.getElementById('incident-evidence').textContent=step.status==='FAIL'?'Check details, timing and a screenshot when available.':'Check details, timing and completed checkpoint screenshots when available.';
    document.getElementById('incident-mail').textContent=labels[step.mail];
    document.getElementById('incident-reason').textContent=step.reason;
  }
  controls.forEach((button,i)=>button.addEventListener('click',()=>show(i)));show(0);
}
