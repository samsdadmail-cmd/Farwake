async function verifyFrontierRegression(frame,out){
 const suites=[['Legacy save transfer',verifyFoundations],['Editing',verifyEditor],['Farm/workshop',verifyProduction],['Economy',verifyEconomy],['Command',verifyCommand],['Research',verifyResearch],['Integration',verifyIntegration],['Frontier technology',verifyFrontierTech],['Frontier industry',verifyFrontierIndustry],['Town',verifyFrontierTown],['Planet',verifyFrontierPlanet],['Mobile UI',verifyFrontierUI]];
 const results=[];
 for(const [name,run] of suites){
  out.textContent=results.join('\n')+'\nRUNNING '+name;
  const report=document.createElement('pre');await run(frame,report);
  const text=report.textContent;
  results.push(name+': '+(text.includes('FAILED')?'FAILED':'COMPLETE')+'\n'+text);
  out.textContent=results.join('\n\n');
 }
 out.textContent+='\nALL SUITES FINISHED';
}
