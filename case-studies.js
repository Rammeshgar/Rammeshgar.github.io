/* A selection aid, not a playback simulation. Every step remains readable. */
(()=>{'use strict';
 document.querySelectorAll('[data-case-flow]').forEach(group=>{
  const buttons=[...group.querySelectorAll('[data-flow-step]')];
  const nodes=[...group.querySelectorAll('[data-flow-node]')];
  const allowed=new Set(nodes.map(n=>n.getAttribute('data-flow-node')));
  const instructions=group.querySelector('.flow-instructions');
  if(instructions)instructions.hidden=false;
  function select(name){
   if(!allowed.has(name))return;
   buttons.forEach(button=>{
    const selected=button.getAttribute('data-flow-step')===name;
    button.setAttribute('aria-pressed',String(selected));
    button.closest('li').classList.toggle('is-selected',selected);
   });
   nodes.forEach(node=>node.classList.toggle('is-selected',node.getAttribute('data-flow-node')===name));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>select(button.getAttribute('data-flow-step'))));
 });
})();
