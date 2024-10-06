import { FC, ReactNode } from 'react';

import best_friends from '../assets/best_friends.png';
import effective_altruism from '../assets/effective_altruism.png';
import feed_hungry from '../assets/feed_hungry.png';
import give_well from '../assets/give_well.png';
import water_project from '../assets/water_project.png';
import wildfire from '../assets/wildfire.png';

import classes from './Fonds.module.css';

export const FOND_ADDRESSES = {
  Random: '',
  GiveWell: '0x546d012aa7f54afa701be51406902b2e57c000b7',
  'Water Project': '0x7cF2eBb5Ca55A8bd671A020F8BDbAF07f60F26C1',
  'Best Friends': '0x897fe74d43CDA5003dB8917DFC53eA770D12ef71',
  'Wildfire Emergency': '0xc7D8F5f7bEfF6F69d97AFC3cE01196272E47E9B0',
  'Feed the Hungry': '0xC61799b2604A2c4b34376BdAD040754031AC5822',
  'EA Funds': '0x530aCBD13f321984B8a04bdf63Df8749Dba5E8cf',
} as const;

export type Fonds = keyof typeof FOND_ADDRESSES;

interface FondDescriptionProps {
  text: string;
  link?: {
    url: string;
    label: string;
  };
  image?: string;
}

const FondDescription: FC<FondDescriptionProps> = ({ text, link, image }) => {
  if (image == null) {
    return <div style={{ gridColumn: 'span 2' }}>{text}</div>;
  }
  return (
    <>
      <div className={classes.fondDescriptionText}>
        {text}
        <a href={link?.url} target='_blank' rel='noreferrer'>
          {link?.label}
        </a>
      </div>
      <div>
        <img src={image} alt='Fond logo' />
      </div>
    </>
  );
};

const fondsDescriptions: Record<Fonds, ReactNode> = {
  Random: (
    <FondDescription
      text={`We can choose the charity for you. 
    Whenever you make a transaction, a small percentage of your funds will go to
    one of the charities mentioned here.`}
    />
  ),
  GiveWell: (
    <FondDescription
      text='Allows you to give to those, who need it most. Rather than rating as many charities as possible, they focus on the few charities that stand out most in order to find the most high-impact giving possibilities.'
      link={{ url: 'https://www.givewell.org/', label: 'Give Well' }}
      image={give_well}
    />
  ),
  'Water Project': (
    <FondDescription
      text='The Water Project is a non-profit organization that provides water projects to communities in Sub-Saharan Africa that are suffering unnecessarily due to a lack of clean water and good sanitation.'
      link={{ url: 'https://thewaterproject.org/', label: 'Water Project' }}
      image={water_project}
    />
  ),
  'Best Friends': (
    <FondDescription
      text="Help homeless animals in every corner of the country. You can choose a sanctuary animal to sponsor. When you sponsor a homeless pet at Best Friends Animal Sanctuary, you help that animal in ways that can't even be counted."
      link={{ url: 'https://bestfriends.org/', label: 'Best Friends' }}
      image={best_friends}
    />
  ),
  'Wildfire Emergency': (
    <FondDescription
      text='Help the individuals and communities most affected by forest fires. They help people to get access to medicine and have a new roof over their head in the shortest time period possible.'
      link={{
        url: 'https://www.readyforwildfire.org/prepare-for-wildfire/get-set/wildfire-action-plan/',
        label: 'Wildfire Emergency',
      }}
      image={wildfire}
    />
  ),
  'Feed the Hungry': (
    <FondDescription
      text='Feed the poor and hungry. Give children a chance to attend school and a brighter future, all with 20 cents per meal. These meals are delivered through our church partners. You can bring hope and faith to children worldwide!'
      link={{ url: 'https://www.feedthehungry.org/', label: 'Feed the Hungry' }}
      image={feed_hungry}
    />
  ),
  'EA Funds': (
    <FondDescription
      text='Allows you to give to those, who need it most. Rather than rating as many charities as possible, they focus on the few charities that stand out most in order to find the most high-impact giving possibilities.'
      link={{ url: 'https://funds.effectivealtruism.org/', label: 'EA Funds' }}
      image={effective_altruism}
    />
  ),
};

interface FondsProps {
  fond: Fonds;
  onFondChange: (fond: Fonds) => void;
}

export const FondsComponent: FC<FondsProps> = ({ fond, onFondChange }) => {
  return (
    <div>
      <div className={classes.fondBtnContainer}>
        {(Object.keys(FOND_ADDRESSES) as Fonds[]).map((name) => (
          <button
            className={classes.fondBtn}
            data-active={fond === name}
            onClick={() => {
              onFondChange(name);
            }}
            key={name}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={classes.fondDescription}>{fondsDescriptions[fond]}</div>
    </div>
  );
};
