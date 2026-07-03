import { CATEGORIES } from './layout';
import styles from '../../styles/MapOfMe.module.css';

// Fixed legend: orientation + quick navigation between constellations.
const ConstellationIndex = ({ focused, onFocus, onReset }) => {
    return (
        <nav className={styles.index} aria-label="Constellations" data-sky-ui>
            <button
                className={`${styles.indexItem} ${!focused ? styles.indexActive : ''}`}
                onClick={onReset}
            >
                OVERVIEW
            </button>
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.key}
                    className={`${styles.indexItem} ${
                        focused === cat.key ? styles.indexActive : ''
                    }`}
                    onClick={() => onFocus(cat.key)}
                >
                    {cat.label}
                </button>
            ))}
        </nav>
    );
};

export default ConstellationIndex;
