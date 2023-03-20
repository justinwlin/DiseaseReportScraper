import pandas as pd


def deduplicate_csv(filepath):
    # read CSV file
    df = pd.read_csv(filepath)

    # remove duplicate rows
    df.drop_duplicates(inplace=True)

    # create new filename with "_deduped" appended
    output_filepath = filepath.replace('.csv', '_deduped.csv')

    # write deduplicated dataframe to a new file
    df.to_csv(output_filepath, index=False)

    # print message to confirm the new file was created
    print(f'Deduplicated file saved as "{output_filepath}"')


deduplicate_csv('./data/H5N8_outbreaks.csv')
# deduplicate_csv('./data/outbreaks.csv')
