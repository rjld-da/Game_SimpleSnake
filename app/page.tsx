'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Position {
  x: number
  y: number
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const GRID_SIZE = 20
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION: Direction = 'RIGHT'
const GAME_SPEED = 150
const MAX_PEACHES = 10

export default function SnakeVentures(): JSX.Element {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [peach, setPeach] = useState<Position>({ x: 15, y: 10 })
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(true)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Generate new peach position that doesn't collide with snake
  const generatePeach = useCallback((currentSnake: Position[]): Position => {
    let newPeach: Position
    do {
      newPeach = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newPeach.x && segment.y === newPeach.y))
    return newPeach
  }, [])

  // Move snake based on current direction
  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying || score >= MAX_PEACHES) return

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // Update head position based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true)
        setIsPlaying(false)
        return currentSnake
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        setIsPlaying(false)
        return currentSnake
      }

      newSnake.unshift(head)

      // Check peach collision
      if (head.x === peach.x && head.y === peach.y) {
        setScore(prev => prev + 1)
        if (score + 1 < MAX_PEACHES) {
          setPeach(generatePeach(newSnake))
        } else {
          // Game won - collected all peaches
          setIsPlaying(false)
        }
      } else {
        // Remove tail if no peach collected
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, gameOver, isPlaying, peach, score, generatePeach])

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameOver && score < MAX_PEACHES) return

    const key = event.key.toLowerCase()
    
    switch (key) {
      case 'w':
        if (direction !== 'DOWN') setDirection('UP')
        break
      case 's':
        if (direction !== 'UP') setDirection('DOWN')
        break
      case 'a':
        if (direction !== 'RIGHT') setDirection('LEFT')
        break
      case 'd':
        if (direction !== 'LEFT') setDirection('RIGHT')
        break
    }
  }, [direction, gameOver, score])

  // Start new game
  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setPeach(generatePeach(INITIAL_SNAKE))
    setGameOver(false)
    setScore(0)
    setIsPlaying(true)
  }

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setPeach({ x: 15, y: 10 })
    setGameOver(false)
    setScore(0)
    setIsPlaying(false)
  }

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev)
  }

  // Hide controls after delay
  useEffect(() => {
    if (isPlaying && showControls) {
      const timer = setTimeout(() => setShowControls(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, showControls])

  // Game loop
  useEffect(() => {
    if (isPlaying && !gameOver && score < MAX_PEACHES) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED)
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isPlaying, gameOver, moveSnake, score])

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // Mobile control handlers
  const handleMobileControl = (newDirection: Direction) => {
    if (gameOver && score < MAX_PEACHES) return
    
    switch (newDirection) {
      case 'UP':
        if (direction !== 'DOWN') setDirection('UP')
        break
      case 'DOWN':
        if (direction !== 'UP') setDirection('DOWN')
        break
      case 'LEFT':
        if (direction !== 'RIGHT') setDirection('LEFT')
        break
      case 'RIGHT':
        if (direction !== 'LEFT') setDirection('RIGHT')
        break
    }
  }

  // Check if game is won
  const isGameWon = score >= MAX_PEACHES

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-pink-50 flex flex-col items-center justify-center p-4 relative">
      {/* Control Box - Desktop: top-middle, Mobile: top-left */}
      {showControls && (
        <Card className={`absolute z-10 transition-all duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } md:top-4 md:left-1/2 md:transform md:-translate-x-1/2 top-4 left-4`}>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium mb-2 md:text-center">Controls</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>W - Up</div>
                <div>S - Down</div>
                <div>A - Left</div>
                <div>D - Right</div>
              </div>
            </div>
            <button 
              onClick={toggleControls}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2 block md:mx-auto"
            >
              Hide
            </button>
          </CardContent>
        </Card>
      )}

      {/* Show Controls Button (when hidden) */}
      {!showControls && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleControls}
          className="absolute top-4 right-4 z-10 text-xs"
        >
          Show Controls
        </Button>
      )}

      {/* Game Container */}
      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        {/* Score and Status */}
        <div className="flex justify-between items-center w-full">
          <div className="text-lg font-semibold text-gray-800">
            Peaches: {score}/{MAX_PEACHES}
          </div>
          {isGameWon && (
            <div className="text-lg font-bold text-green-600">🎉 Victory!</div>
          )}
          {gameOver && !isGameWon && (
            <div className="text-lg font-bold text-red-600">Game Over</div>
          )}
        </div>

        {/* Game Board */}
        <Card className="w-full aspect-square max-w-md">
          <CardContent className="p-4">
            <div 
              className="grid gap-1 w-full h-full bg-green-100 rounded-lg p-2"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE
                const y = Math.floor(index / GRID_SIZE)
                
                const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
                const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
                const isPeach = peach.x === x && peach.y === y

                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-sm ${
                      isSnakeHead ? 'bg-emerald-400' :
                      isSnakeBody ? 'bg-emerald-300' :
                      isPeach ? 'bg-pink-400' :
                      'bg-green-50'
                    } ${isPeach ? 'animate-pulse' : ''}`}
                  >
                    {isPeach && (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        🍑
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Game Controls */}
        <div className="flex gap-2">
          {!isPlaying ? (
            <Button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white">
              {score === 0 && !gameOver ? 'Start Game' : 'Play Again'}
            </Button>
          ) : (
            <Button onClick={resetGame} variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Game Instructions */}
        {!isPlaying && score === 0 && !gameOver && (
          <div className="text-sm text-gray-600 text-center max-w-sm space-y-2">
            <p>🐍 Navigate your snake to collect peaches!</p>
            <p>🍑 Collect all {MAX_PEACHES} peaches to win!</p>
            <p>⚠️ Avoid hitting walls or yourself!</p>
          </div>
        )}
      </div>

      {/* Mobile Controls - Only show on mobile */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <Button
            variant="outline"
            size="sm"
            onTouchStart={() => handleMobileControl('UP')}
            className="bg-white/80 hover:bg-white/90 text-gray-700 h-12 w-12 p-0"
          >
            ↑
          </Button>
          <div></div>
          
          <Button
            variant="outline"
            size="sm"
            onTouchStart={() => handleMobileControl('LEFT')}
            className="bg-white/80 hover:bg-white/90 text-gray-700 h-12 w-12 p-0"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onTouchStart={() => handleMobileControl('DOWN')}
            className="bg-white/80 hover:bg-white/90 text-gray-700 h-12 w-12 p-0"
          >
            ↓
          </Button>
          <Button
            variant="outline"
            size="sm"
            onTouchStart={() => handleMobileControl('RIGHT')}
            className="bg-white/80 hover:bg-white/90 text-gray-700 h-12 w-12 p-0"
          >
            →
          </Button>
        </div>
      </div>
    </main>
  )
}