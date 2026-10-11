# Class moments update

Extract this ZIP into your existing G:\rdgl folder, and replace the matching files. Do not create a separate folder. Your .env.local, admin login, database and uploaded videos stay in place.

Stop the running server with Ctrl+C, then run npm run dev. For production use npm run build:app followed by npm start.

Clips now fit within a compact screen-relative player. Swipe horizontally on mobile or use the arrows on desktop. The complete video frame is shown without cropping. Clips pause when swiped out of view. No database changes or new packages are required.
