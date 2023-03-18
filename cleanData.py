import pandas as pd

def dedupe_csv(path):
    df = pd.read_csv(path)
    df.drop_duplicates(inplace=True)
    return df

dedupe_csv('./data/events.csv')
dedupe_csv('./data/outbreaks.csv')