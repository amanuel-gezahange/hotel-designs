# Stay Kit

**What is this?**
A tool that makes a website for a hotel or guest house.

**What do you get?**
A finished website in English and Amharic. You give it to the hotel. They put it on their hosting.

**What do you do?**
Run one command. Then click buttons in your browser.


---


## Step 1. Start it (the only command)

Open the terminal in the stay-kit folder. Type this and press Enter:

    npm run dev

Leave the terminal open. Do not close it while you work.


## Step 2. Open it in Chrome

Go to this address:

    localhost:3000/admin

**The first time only:** you will see "Create your admin account".
Type any email and a password (at least 8 letters). Click Create account.
That is now your login. Next time, use the same email and password.


## Step 3. Add a hotel

You are on the **Clients** page. Do ONE of these:

- Click **Import from folder** to bring in hotels that already exist.
- Or click **+ New client**, fill in the hotel name and the owner's email, and click Create client.


## Step 4. Fill in the hotel

Click **Edit** on the hotel's row. Change the words, phone number, rooms and prices.
Upload the photos. Click **Save changes** (top right).

Tips:

- The WhatsApp number is numbers only, with the country code, no plus sign.
  Example: 251911234567
- Any photo size is fine. They are made smaller for you.


## Step 5. Pick a design

Click the **⋯** button on the hotel's row, then **Preview all designs**. The hotel opens with a small bar at the bottom.

- On a computer: press the left and right arrow keys.
- On a phone: swipe left or right.
- Press the play button to see them all, one by one.

There are 15 designs. When the client picks one, go to **Edit**, open the
"Look and hero" tab, choose it in the Style box, and click **Save changes**.


## Step 6. Look at the real website

Click **View** to see the hotel's real website.


## Step 7. Give it to the client

Click the **⋯** button on the hotel's row, then **Download website (zip)**. Wait about 1 minute. A zip file downloads.

Send the zip to the client. They upload what is inside it to their hosting.
(On cheap hosting, put the files in the public_html folder.)

Done.


---


## Show it to a customer (put it online)

    npm run share -- hotel-name

The first time it opens your browser to log in to Netlify (free) and asks you to name the site.
At the end it prints "Deployed to production URL". Send that link to the customer.
They can swipe through all 15 designs on their own phone.

When the client has chosen a design, put the finished website online:

    npm run share -- hotel-name --final


---


## If something goes wrong

**The page is stuck or keeps flickering.**
Press Ctrl + C in the terminal. Then type:

    rm -rf .next && npm run dev

**"Port 3000 already in use".**
Type this, then run `npm run dev` again:

    pkill -f "next dev"

**"Too many attempts" when logging in.**
Wait 10 minutes.

**Download shows a red message.**
Read it. It says what to fix, for example a missing field in the hotel's details.

**I forgot my password.**
Type this (use your own email and a new password):

    ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=new-password npm run seed


---


## Optional: for people who like commands

You never need these. The buttons above do the same things.

    npm run demo                  see the sample hotel
    npm run themes -- demo-lodge  flip through all 15 designs
    npm run try -- beta-lodge     build a hotel and open it
    npm run make -- beta-lodge    make the zip for a hotel from the editor
    npm run test                  check the code has no mistakes

More details for developers: TECHNICAL.md
