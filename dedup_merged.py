import pandas as pd

# reads in the merged.csv file
merged = pd.read_csv("./data/H5N8_merged.csv")
# merged = pd.read_csv("./data/merged.csv")

# removes rows that has dulicated values on the event-enevtID and outbreak-outbreakNumber columns
merged.drop_duplicates(subset=["event-eventID", "outbreak-outbreakNumber",
                       "outbreak-animal type", "outbreak-longitude", "outbreak-latitude"], inplace=True)

# writes the deduplicated dataframe to a new file
merged.to_csv("./data/H5N8_final_data.csv", index=False)
# merged.to_csv("./data/H5N1_final_data.csv", index=False)

# prints a message to confirm the new file was created
print("Deduplicated file saved as 'H5N8_final_data.csv'")
# print("Deduplicated file saved as 'H5N1_final_data.csv'")
