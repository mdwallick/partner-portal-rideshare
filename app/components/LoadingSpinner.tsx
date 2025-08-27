import React from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  color?: "primary" | "secondary" | "white" | "orange"
  text?: string
  fullScreen?: boolean
  className?: string
}

export default function LoadingSpinner({
  size = "md",
  color = "orange",
  text,
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16",
    xl: "h-32 w-32",
  }

  const colorClasses = {
    primary: "border-blue-500",
    secondary: "border-gray-500",
    white: "border-white",
    orange: "border-orange-500",
  }

  const spinner = (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
    />
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        {spinner}
        {text && <p className="mt-4 text-gray-400 text-lg font-medium">{text}</p>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {spinner}
      {text && <p className="mt-4 text-gray-400 text-center">{text}</p>}
    </div>
  )
}
