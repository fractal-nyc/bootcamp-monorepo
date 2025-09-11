# Hardware and Peripherals
This unit introduces the student to using peripherals (discrete pieces of hardware connected to the computer) to allow their programs to receive input from new sources (e.g. webcams, microphones, game pads) and thus enable new computing experiences.

## Concepts/Tools/Techniques/Libraries

- KeyboardEvent API
- MouseEvent API
- requestAnimationFrame
- `<canvas>` element
- Web Audio API
- File API
- Web Gamepad API

## Projects

- Typing speed game: get a dictionary of words, pick a random word, make the user type it and highlight each letter in turn, report how fast they did it.
    - Challenge: make the user type entire sentences
    - Challenge: Show a history of all the words/sentences user has typed, allow them to replay past words to get a better score
- Google Lens clone: render the webcam feed to a web page `<canvas>` element, capture the frame when the user presses spacebar (or clicks the rendering canvas), send it to a computer vision API, get back information on what's in the picture
- Record input from the microphone, play it back, send it to a transcription API, get the text back.
    - Simple version: local voice notes app (save the records to loca)
    - Alternatively, send it to ChatGPT and make a voice chatbot
    - Challenge: Draw overlays on top of the video feed
- Treasure collector game: draw the player on `<canvas>`, then use gamepad or keyboard API to more the player around to collect randomly-generated targets