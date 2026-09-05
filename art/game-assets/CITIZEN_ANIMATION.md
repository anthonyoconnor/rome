# Citizen animation

The former single bobbing pose is replaced with a textured character rig. It generates 24 walking poses and an idle pose for each of four street directions at load time. The game draws one cached sprite per citizen, including the existing depth ordering and ground shadow.

The rig articulates upper and lower legs, sandals, upper arms and forearms. Feet stay on the ground during the stance phase and lift during the swing phase. Arms counter-swing, and the torso moves slightly with the gait. Step timing comes from distance traveled; pause freezes both travel and pose, while fast-forward advances both together. Road junctions preserve movement remainder, and citizens stand still on isolated streets.

Front artwork reuses the original `public/art/citizen.png`. The new rear artwork is `public/art/citizen-back.png` (1024 × 1536, RGBA), generated with the built-in imagegen tool. Its exact prompt is in [citizen-back-prompt.txt](citizen-back-prompt.txt). The two images remain unchanged; the game renders their articulated parts into an in-memory atlas.

Verified at enlarged and actual game scale in the browser, plus automated checks for foot contact, complete gait cycles, facing, continuous street movement, pause, fast-forward, frame-rate independence, and removed roads. Run `npm run check:citizens` for those checks.
