# README

To get started, run the command "npm install" to install the needed dependencies for this project which include:
-- Phaser latest
-- Typescript latest
-- Vite latest

To run the project locally, run the command "npm run dev". This will open a page on the address: http://localhost:5173/

---- NORMAL GAMEPLAY ----
You'll be greeted a game that looks like a retro arcade cabinet with a spinning wheel up top. To start the game, press "PLAY GAME".
The wheel will then move down with the button you just pressed disabled along with the blue demot button. The logo will also dissapear in the middle.
Once the wheel has done animating towards the bottom, a button will pop up with "PRESS TO SPIN". Pressing this button will start the wheel.
Once a slice is landed on, a win celebration text will pop up and bangup to the slice value you just landed on.
You can then wait for the celebration to bangup all the way over the next 5 seconds or click the "PLAY GAME" button to jump ahead.
Either way the celebration will stop and the wheel will animate back to the top with the logo taking it's place again, signifying the end of that round.

--- DEBUGGING -----
On the idle screen, the blue demo button in the bottom left corner will light up. Clicking on it will reveal 8 buttons with slice numbers and credit values on them. Clicking on the demo button will automatically press the "PLAY GAME" button and proceed as normal except it will bypass the "PRESS TO SPIN" button. It will then land on whatever slice you selected from the demo screen and bang up as usual and reset back to the title screen afterwards.

--- BUILDING AND PREVIEWING ---
You can then build the project with "npm run build". This will create the project in the "dist/" folder. You can then preview the contents of this folder with "npm run preview". This uses the command from vite builder to preview the game. The address for this previewer is http://localhost:4173/

-------------- DEVELOPMENT ------------------------

-- Font from https://freefonts.co/fonts/gill-sans-extra-bold

-- wheel-land and wheel-pick were provided
-- Rest of the audio was taken from: https://pixabay.com/sound-effects/search/ui/

-- Most of the code I have written is directly from me but there was lots of searching and utilizing Google AI's search history. It proved very useful for small things and how to communicate with Phaser's package on how to present the best game. I tend to avoid copying code directly from AI as it is not always directly relevant to what I am trying to accomplish. This helps me understand what I am copying over and what it is doing exactly.
-- The game uses Canvas mode as this was much more performative. Originally was set to AUTO but was clear it was using WebGL. Switching to this required getting rid of grayscale images and just setting their color. This brough the performance of the game from 20-30 FPS to over 100+ on my PC. Was not able to test on mobile devices but confident it would run pretty smoothly. It is commented out in the index.html but there is an FPS counter that can be uncommented and is updated in the WheelGame.ts scene script.
-- main.ts launches the game and the game's main config is housed.
-- Originally this project was done in Phaser Launcher with a native web building and previewing but was quickly abandoned as that does not support typescript. The decision was then to just move it to a pure node.js project using Vite as the web builder and previewing.
-- The animations for the wheel were done using Phaser's tween system. By using simple physics, it was easy to animate the wheel to quickly speed up but smoothly slow down without it looking "odd".
-- All assets provided are under the "public" folder and are referenced in the game using the packing system that uses the json format.
-- The logical flow of the game is used with the StateMachine script and enum States under "States.ts". This allowed a much easier way of understanding when to run animations and at what point the game is in when a button is clicked or any event is fired. You can even check out the console logs and can see when the state is changed and it makes also very easy for debugging purposes.
-- UIButton class was used to create and build the buttons for the game using the Gill Sans font rather than using traditional fonts such as "Arial" and "Calibri". This made controlling their button states a lot more easily by using them as containers.
-- WheelGame is the main scene and controls all of the logic of the game. Housing all the components and when to run animations via a listener to the StateMachine it instantiates.
-- CoinSlot.ts controls the coin animations when the "PLAY SPIN" button is clicked.
