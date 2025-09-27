# Emoji Merge Game 🐭

A browser-based physics puzzle game where players drop emojis into a container, merging identical emojis to create higher-tier variants. Inspired by popular merge games, this implementation uses a playful emoji progression system with satisfying physics-based gameplay.

## 🎮 Game Features

- **Physics-based gameplay**: Drop and merge emojis with realistic physics
- **10-tier progression system**: Start with 🐭 and work your way up to 🐻‍❄️
- **Chain reactions**: Create satisfying cascades of merges
- **Score tracking**: Track your points as you merge higher-tier emojis
- **Win/lose conditions**: Reach the top tier without overflowing the container

## 🎯 How to Play

1. Move your mouse or finger to aim where you want to drop the emoji
2. Click or tap to release the emoji into the container
3. When two identical emojis touch, they merge into the next tier
4. Keep merging to reach higher tiers and increase your score
5. Don't let emojis overflow the container!
6. Reach the polar bear (🐻‍❄️) to win!

## 📊 Emoji Progression

1. 🐭 Mouse (base tier)
2. 🐹 Hamster
3. 🐸 Frog
4. 🐰 Rabbit
5. 🐱 Cat
6. 🐷 Pig
7. 🐶 Dog
8. 🐻 Bear
9. 🦁 Lion
10. 🐻‍❄️ Polar Bear (win condition)

## 🛠 Technical Stack

- **HTML5 Canvas**: For rendering the game graphics
- **Matter.js**: Physics engine for realistic emoji interactions
- **Vanilla JavaScript**: ES6 modules for clean, framework-free code
- **CSS3**: Responsive design with CSS variables for theming

## 📁 Project Structure

```
life-sim/
├── index.html          # Main game HTML
├── src/
│   └── main.js        # Core game logic
├── styles/
│   └── main.css       # Game styling
├── vendor/
│   └── matter.min.js  # Physics engine library
├── assets/            # Game assets (if any)
├── resources/         # Additional resources
└── tasks/
    └── emoji-merge-game-plan.md  # Development plan
```

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd life-sim
   ```

2. Open the game in your browser:
   - Simply open `index.html` in a modern web browser
   - Or use a local server for development:
     ```bash
     python -m http.server 8000
     # Then navigate to http://localhost:8000
     ```

## 🎨 Development

The game is built with vanilla JavaScript and requires no build process. Edit the files directly and refresh your browser to see changes.

### Key Files
- `src/main.js` - Core game logic and physics
- `styles/main.css` - Visual styling and layout
- `index.html` - Game structure and UI elements

## 🎯 Roadmap

- [ ] Sound effects and background music
- [ ] Particle effects for merges
- [ ] Mobile touch optimization
- [ ] Leaderboard system
- [ ] Additional emoji themes
- [ ] Difficulty modes
- [ ] Accessibility improvements

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Matter.js](https://brm.io/matter-js/) physics engine
- Inspired by popular merge puzzle games
- Emoji graphics provided by system fonts