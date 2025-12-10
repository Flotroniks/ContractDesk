/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import "./App.css";
import { AppContainer } from "./components/AppContainer";

/**
 * Root renderer that wires global styles and delegates to the main application container.
 * @component
 * @returns React element mounting the application UI.
 */
export default function App() {
    return <AppContainer />;
}
