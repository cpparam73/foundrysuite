VIDEO BACKGROUND SETUP
======================

To add a video background to the hero section:

1. Add your video file(s) to this directory:
   - hero-background.mp4 (MP4 format - required)
   - hero-background.webm (WebM format - optional, for better browser support)

2. Video Requirements:
   - Format: MP4 (H.264 codec) and/or WebM
   - Recommended resolution: 1920x1080 (Full HD) or higher
   - Aspect ratio: 16:9 (landscape)
   - Duration: 10-30 seconds (will loop automatically)
   - File size: Optimize for web (under 5MB recommended)
   - Content: Should be subtle and not distract from text

3. Video Settings:
   - The video will automatically:
     * Play on page load
     * Loop continuously
     * Be muted (required for autoplay)
     * Cover the entire hero section
     * Have a semi-transparent overlay for text readability

4. Fallback:
   - If the video fails to load or can't play, the background gradient will show instead
   - The video is hidden on mobile devices (under 480px) to save bandwidth

5. Customization:
   - To adjust video opacity, edit `.hero-video-bg` in styles.css
   - To adjust overlay opacity, edit `.hero-video-overlay` in styles.css
   - To change overlay colors, modify the gradient in styles.css

6. Performance Tips:
   - Compress your video using tools like HandBrake or FFmpeg
   - Use MP4 with H.264 codec for best compatibility
   - Consider using a shorter video (10-15 seconds) for faster loading
   - Test on different devices and connections

Example FFmpeg command to optimize video:
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart hero-background.mp4





