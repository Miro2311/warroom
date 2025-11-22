import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'relative font-display font-bold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'

    const variants = {
      primary: 'bg-holo-cyan text-deep-void hover:bg-holo-cyan/90 shadow-lg shadow-holo-cyan/20',
      secondary: 'bg-lust-pink text-deep-void hover:bg-lust-pink/90 shadow-lg shadow-lust-pink/20',
      danger: 'bg-simp-red text-white hover:bg-simp-red/90 shadow-lg shadow-simp-red/20',
      ghost: 'bg-transparent border border-holo-cyan/30 text-holo-cyan hover:bg-holo-cyan/10',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
