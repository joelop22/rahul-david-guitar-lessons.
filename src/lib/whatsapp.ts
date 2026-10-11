export type Confirmation={admission_number:string,student_name:string,course_name_snapshot:string,batch_label_snapshot:string,mode_snapshot:string,amount_due_paise:number,payment_id:string};
export function whatsappLink(info:Confirmation){
 const recipient=(process.env.WHATSAPP_OWNER_NUMBER||'917994357541').replace(/[^0-9]/g,'');
 const lines=["Hello Rahul! I have completed my guitar class admission payment.","",`Admission ID: ${info.admission_number}`,`Student: ${info.student_name}`,`Course: ${info.course_name_snapshot}`,`Batch: ${info.batch_label_snapshot}`,`Class mode: ${info.mode_snapshot === 'home' ? 'Home tuition' : info.mode_snapshot}`,`Amount paid: ₹${(info.amount_due_paise/100).toFixed(2)}`,`Razorpay payment ID: ${info.payment_id}`,"Payment status: Verified", "", "Please confirm my admission and share the next steps. Thank you!"];
 return `https://wa.me/${recipient}?text=${encodeURIComponent(lines.join('\n'))}`;
}
