import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles } from 'lucide-react';

import './main.css';
import { ReactifyStandaloneAngularComponent } from 'ngx-reactify';
import { AngularComponent } from './angular-child.component';

import "zone.js";

const AngularReactComponent = ReactifyStandaloneAngularComponent(AngularComponent, [], 'ngx-react-wrapped', true)

// Main App component
const App = () => {
    const [clicks, setClicks] = useState(0);
    const [isAngularRendered, setIsAngularRendered] = useState(true);

    const [angularClicks, setAngularClicks] = useState(10);


    return <div>
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform transition-all duration-300 hover:scale-105">
                <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 font-inter">
                    Hello from your tiny React app!
                </h1>

                <p className="text-lg text-gray-700 mb-6 font-inter">
                    This is a simple React app that embeds an Angular component, styled with Tailwind CSS, and using Lucide icons.
                </p>

                <p className="text-md text-gray-900 mb-4 font-inter">
                    React Clicks: {clicks}
                </p>

                <button
                    onClick={() => setClicks(clicks+1)}
                    className="text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                    style={{ background: "#58c4dc" }}
                >
                    Click Me
                </button>

                <div style={{ marginTop: "24px" }}>
                    <button
                        onClick={() => setIsAngularRendered(isAngularRendered ? false : true)}
                        className="text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                        style={{ background: "#58c4dc" }}
                    >
                        Toggle Angular Component
                    </button>
                </div>

                <div style={{marginTop: "24px"}}>
                    {
                        isAngularRendered ? <>
                            <AngularReactComponent
                                // This causes React to re-render the Angular
                                // component every time angularClicks changes
                                // it also enables pre-seeding 2-way bindings
                                // This is sub-optimal for Angular flows but
                                // follows the intended React practice
                                clicks={angularClicks}
                                clickChange={setAngularClicks}

                                name="Alex"
                            />
                            <div>Clicks from Angular {angularClicks}</div>
                        </> : (
                            <div style={{height: '144px'}}>'Angular component is hidden.'</div>
                        )
                    }
                </div>
            </div>
        </div>
    </div>;
}

try {
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
catch(err) {
    console.error(err)
}
