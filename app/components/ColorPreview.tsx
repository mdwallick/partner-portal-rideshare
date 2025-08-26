"use client"

export default function ColorPreview() {
  const colors = [
    { name: "Primary", class: "bg-waymo-primary", text: "text-white" },
    { name: "Primary Light", class: "bg-waymo-primary-light", text: "text-white" },
    { name: "Primary Dark", class: "bg-waymo-primary-dark", text: "text-white" },
    { name: "Secondary", class: "bg-waymo-secondary", text: "text-white" },
    { name: "Secondary Light", class: "bg-waymo-secondary-light", text: "text-white" },
    { name: "Secondary Dark", class: "bg-waymo-secondary-dark", text: "text-white" },
    { name: "Accent", class: "bg-waymo-accent", text: "text-white" },
    { name: "Accent Light", class: "bg-waymo-accent-light", text: "text-white" },
    { name: "Accent Dark", class: "bg-waymo-accent-dark", text: "text-white" },
    { name: "Success", class: "bg-waymo-success", text: "text-white" },
    { name: "Warning", class: "bg-waymo-warning", text: "text-white" },
    { name: "Danger", class: "bg-waymo-danger", text: "text-white" },
  ]

  const neutrals = [
    { name: "50", class: "bg-waymo-neutral-50", text: "text-waymo-neutral-900" },
    { name: "100", class: "bg-waymo-neutral-100", text: "text-waymo-neutral-900" },
    { name: "200", class: "bg-waymo-neutral-200", text: "text-waymo-neutral-900" },
    { name: "300", class: "bg-waymo-neutral-300", text: "text-waymo-neutral-900" },
    { name: "400", class: "bg-waymo-neutral-400", text: "text-white" },
    { name: "500", class: "bg-waymo-neutral-500", text: "text-white" },
    { name: "600", class: "bg-waymo-neutral-600", text: "text-white" },
    { name: "700", class: "bg-waymo-neutral-700", text: "text-white" },
    { name: "800", class: "bg-waymo-neutral-800", text: "text-white" },
    { name: "900", class: "bg-waymo-neutral-900", text: "text-white" },
  ]

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-waymo-neutral-900 mb-8 text-center">
          Waymo-Inspired Color Palette (Light Theme)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Colors */}
          <div className="bg-white rounded-lg p-6 border border-waymo-neutral-200 shadow-sm">
            <h2 className="text-2xl font-semibold text-waymo-neutral-900 mb-4">Main Colors</h2>
            <div className="grid grid-cols-2 gap-4">
              {colors.map(color => (
                <div key={color.name} className="space-y-2">
                  <div
                    className={`h-20 rounded-lg ${color.class} ${color.text} flex items-center justify-center font-medium`}
                  >
                    {color.name}
                  </div>
                  <p className="text-sm text-waymo-neutral-600">{color.class}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Colors */}
          <div className="bg-white rounded-lg p-6 border border-waymo-neutral-200 shadow-sm">
            <h2 className="text-2xl font-semibold text-waymo-neutral-900 mb-4">Neutral Colors</h2>
            <div className="grid grid-cols-2 gap-4">
              {neutrals.map(color => (
                <div key={color.name} className="space-y-2">
                  <div
                    className={`h-20 rounded-lg ${color.class} ${color.text} flex items-center justify-center font-medium`}
                  >
                    {color.name}
                  </div>
                  <p className="text-sm text-waymo-neutral-600">{color.class}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-waymo-neutral-200 shadow-sm">
          <h2 className="text-2xl font-semibold text-waymo-neutral-900 mb-4">Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-danger">Danger Button</button>
            <button className="btn-success">Success Button</button>
            <button className="btn-accent">Accent Button</button>
            <div className="card">
              <h3 className="text-lg font-semibold text-waymo-neutral-900 mb-2">Light Card</h3>
              <p className="text-waymo-neutral-600">Example of a light-themed card component.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
