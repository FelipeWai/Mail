document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


// FUNCTION THAT LOAD THE COMPOSE-EMAIL VIEW
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// FUNCTION THAT SEND THE NEW EMAIL TO THE API
document.addEventListener('DOMContentLoaded', function(){
  document.querySelector('#compose-form').onsubmit = function(event) {
      event.preventDefault();
      
      const recipients = document.querySelector('#compose-recipients').value;
      const subject = document.querySelector('#compose-subject').value;
      const body = document.querySelector('#compose-body').value;

      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
      })
      .then(response => {
          if (!response.ok) {
              throw new Error("Error sending the email");
          }
          return response.json();
      })
      .then(() => load_mailbox('sent'))
      .catch(error => {
          alert(error.message);
          compose_email();
      });
  };
});

// FUNCTIONS THAT LOAD THE EMAIL FROM THE API
function load(mailbox){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    Object.keys(data).forEach(emailId => {
      const email = data[emailId];
      add_email(email);
    });
  });
}


// FUNCTIONS THAT LOAD THE EMAIL ON THE VIEW PAGE (EX: INBOX, SENT, ARCHIVE)
function add_email(content){
  const email = document.createElement('div');
  email.className = 'email';
  const sender = content.sender;
  let subject = content.subject;
  const timestamp = content.timestamp;

  const backgroundColor = content.read ? '#dddddd' : '#ffffff';
  email.style.backgroundColor = backgroundColor; 
  
  email.innerHTML = `
      <p class="sender"><a href="#" onclick="load_email(${content.id}); return false;"><strong>${sender}</strong></a></p>
      <p class="subject">${subject}</p>
      <p class="timestamp">${timestamp}</p>
    `;

  document.querySelector('#emails-view').append(email);
}

function load_email(emailID){
  fetch(`/emails/${emailID}`)
  .then(response => response.json())
  .then(email => {
    fetch(`/emails/${emailID}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
    view_email(email);
  })
  .catch(error => {
    console.error('Error fetching email details:', error);
  });
}


function reply(emailID) {
  fetch(`/emails/${emailID}`)
    .then(response => response.json())
    .then(email => {
      const formattedBody = `
        On ${email.timestamp}, ${email.sender} wrote:\n
        ------------------------------\n
        ${email.body}

        Re:

        ------------------------------\n
        `;
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = formattedBody;
    })
    .catch(error => {
      console.error('Error fetching email details:', error);
    });
}

function view_email(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email').style.display = 'block';

  document.querySelector('#email').innerHTML = '';

  const emailDetails = document.createElement('div');
  emailDetails.className = 'email-details';
  user_email = document.querySelector('#user_email').innerHTML;
  const formattedBody = email.body.replace(/\n/g, '<br>');
  
  if(user_email === email.sender){
    emailDetails.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" onclick="reply(${email.id})">Reply</button>
      <hr>
      <p>${formattedBody}</p>
    `;
  }
  else{
    if (!email.archived){
        emailDetails.innerHTML = `
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <button class="btn btn-sm btn-outline-warning" onclick="archive(${email.id})">Archive</button>
        <button class="btn btn-sm btn-outline-primary" onclick="reply(${email.id})">Reply</button>
        <hr>
        <p>${formattedBody}</p>
      `;
    }
    else {
      emailDetails.innerHTML = `
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <button class="btn btn-sm btn-outline-warning" onclick="archive(${email.id})">Unarchive</button>
        <button class="btn btn-sm btn-outline-primary" onclick="reply(${email.id})">Reply</button>
        <hr>
        <p>${formattedBody}</p>
      `;
    }
  }
  

  document.querySelector('#email').appendChild(emailDetails);
}

function archive(emailID){
  fetch(`/emails/${emailID}`)
  .then(response => response.json())
  .then(email => {
    if (!email.archived){
      fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
        })
      .then(() =>{
          load_mailbox('inbox')
        });
    }
    else {
        fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
        .then(() =>{
            load_mailbox('inbox')
          });
      }
  })
}


// FUNCTION THAT LOAD THE MAILBOX VIEW
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  load(mailbox);
}
