# Formspree Setup Guide - Super Simple! 🚀

## ✅ Form is Ready!

I've added the contact form back to your website. Now you just need to connect it to Formspree.

## 📋 Quick Setup (3 Steps - Takes 2 Minutes!)

### Step 1: Sign Up for Formspree (Free)

1. Go to: **https://formspree.io**
2. Click **"Sign Up"** (or "Get Started")
3. Sign up with your email: `parameswaran.cp@foundrysuite.com`
4. Verify your email (check your inbox)

### Step 2: Create a New Form

1. After logging in, click **"New Form"**
2. Give it a name: "FoundrySuite Contact Form"
3. Set the email where submissions go: `parameswaran.cp@foundrysuite.com`
4. Click **"Create Form"**

### Step 3: Get Your Form URL

1. You'll see a form URL that looks like:
   ```
   https://formspree.io/f/XXXXXX
   ```
2. **Copy this URL**

### Step 4: Update Your Website

1. Open `index.html` in a text editor
2. Find this line (around line 1022):
   ```html
   <form class="contact-form" id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID_HERE" method="POST">
   ```
3. Replace `YOUR_FORM_ID_HERE` with your actual Formspree form ID
   - For example, if your URL is `https://formspree.io/f/abc123`, replace it with `abc123`
   - The line should look like:
   ```html
   <form class="contact-form" id="contactForm" action="https://formspree.io/f/abc123" method="POST">
   ```
4. Save the file
5. Upload to your website

## ✅ That's It!

Now when someone fills out your contact form:
- ✅ Form submits to Formspree
- ✅ Formspree sends email to `parameswaran.cp@foundrysuite.com`
- ✅ You receive the submission in your inbox
- ✅ No PHP, no backend, no setup needed!

## 🎯 What You Get

- **Free Plan**: 50 submissions per month
- **Email notifications**: Every submission sent to your email
- **Spam protection**: Built-in spam filtering
- **No coding needed**: Just works!

## 📧 Need Help?

If you need help finding your Formspree URL:
1. Log into Formspree
2. Go to "Forms" section
3. Click on your form
4. Copy the "Endpoint URL" - that's what you need!

---

**That's it! Super simple and it just works!** 🎉




