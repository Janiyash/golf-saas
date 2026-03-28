export function formatDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
export function formatMonthYear(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
export function capitalize(s){if(!s)return'';return s.charAt(0).toUpperCase()+s.slice(1)}
export function formatCurrency(a){return'£'+(parseFloat(a)||0).toFixed(2)}
export function matchTypeToLabel(n){if(n>=5)return'Jackpot Winner';if(n===4)return'4 Number Match';if(n===3)return'3 Number Match';return'No Match'}
export function monthsSince(d){if(!d)return 0;const s=new Date(d),n=new Date();return(n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth())}
export function truncate(s,m=60){if(!s)return'';return s.length>m?s.slice(0,m)+'…':s}
