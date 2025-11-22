'use client'

import { useEffect, useRef, useState } from 'react'

interface StarsBackgroundProps {
  factor?: number
  speed?: number
  starColor?: string
  className?: string
}

interface Star {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

export function StarsBackground({
  factor = 0.0001,
  speed = 30,
  starColor = '#ffffff',
  className = '',
}: StarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const starsRef = useRef<Star[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Initialize stars with more visible count
    const starCount = Math.floor(dimensions.width * dimensions.height * factor)
    console.log('Creating stars:', starCount)

    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * (speed / 50),
      speedY: (Math.random() - 0.5) * (speed / 50),
      opacity: Math.random() * 0.5 + 0.5,
    }))

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      starsRef.current.forEach((star) => {
        // Update position
        star.x += star.speedX
        star.y += star.speedY

        // Wrap around screen
        if (star.x < 0) star.x = dimensions.width
        if (star.x > dimensions.width) star.x = 0
        if (star.y < 0) star.y = dimensions.height
        if (star.y > dimensions.height) star.y = 0

        // Twinkle effect
        star.opacity = Math.sin(Date.now() * 0.001 + star.x) * 0.3 + 0.7

        // Draw star with opacity
        ctx.fillStyle = starColor
        ctx.globalAlpha = star.opacity
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, factor, speed, starColor])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none', zIndex: 0 }}
    />
  )
}
