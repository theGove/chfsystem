function list_festival_participants(data){
    const html=[]
    html.push('<h1>Festival Participants</h1><table class="tableFixHead"><thead><th>Last Name</th><th>First Name</th><th>Email</th><th>Mobile Phone</th></tr></thead><tbody>')
    for(const record of data.records){
        html.push('<tr>')

        if(record.fields.last_name===undefined){html.push('<td></td>')}else{
            html.push('<td><a target="_blank" href="/pages/edit_participant/edit_participant.html?key=' + record.fields.key + '">'+record.fields.last_name+'</a></td>')
        }
        if(record.fields.first_name===undefined){html.push('<td></td>')}else{
            html.push('<td>'+record.fields.first_name+'</td>')
        }
        if(record.fields.email===undefined){html.push('<td></td>')}else{
            html.push('<td><a href="mailto://'+record.fields.email+'?subject=Colonial Heritage Festival ">'+record.fields.email+'</td>')
        }
        if(record.fields.mobile_phone===undefined){html.push('<td></td>')}else{
            html.push('<td>'+record.fields.mobile_phone+'</td>')
        }

        html.push('</tr>')
    }
    html.push('</tbody></table>')
    document.getElementById("body").innerHTML = html.join("")
}
