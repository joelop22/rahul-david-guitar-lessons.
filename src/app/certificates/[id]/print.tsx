'use client';
export function PrintCertificate(){return <div className="certificate-print-tools"><button className="button-primary" onClick={()=>window.print()}>Print / Save as PDF</button><p>Choose landscape A4. Select “Save as PDF” as the printer to download. Turn off browser headers and footers.</p></div>;}
