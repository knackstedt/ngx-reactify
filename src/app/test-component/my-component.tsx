import React, { useState } from 'react';

export type MyComponentProps = {
    value: number,
    valueChange: (value: number) => void,
    fireMessage: (evt) => void
}

// Define the functional component using React.FC and the props interface
const MyComponent: React.FC<{props: MyComponentProps }> = ({ props }) => {

    // State hook to manage a counter
    const [count, setCount] = useState<number>(props.value);

    // Event handler for button click
    const handleClick = () => {
        setCount(prevCount => {
            let v = prevCount + 1
            props.valueChange(v);
            return v;
        });
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h4>I am the React Child Element</h4>
            <p>I am nested inside of an Angular parent.</p>

            <p>You have clicked the button {count} times.</p>
            <button
                onClick={handleClick}
                style={{
                    padding: '10px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '8px'
                }}
            >
                Click Me
            </button>

            <button
                onClick={props.fireMessage}
                style={{
                    padding: '10px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Fire Message
            </button>
        </div>
    );
};

export default MyComponent;
