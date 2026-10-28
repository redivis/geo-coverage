import Button from '@mui/material/Button';

import styles from './styles.css';

export default function Header({ title, isUserAuthorized, onAuthorize, onDeauthorize }) {
	const renderHeaderLogo = () => {
		const headerLogo = (
			<div
				className={styles.headerLogo}
				style={{ height: 33, width: 194, backgroundImage: `url(${process.env.ROOT_PATH}/assets/header.svg)` }}
			/>
		);
		return title ? <a href={`https://labs.redivis.com`}>{headerLogo}</a> : headerLogo;
	};

	return (
		<div className={styles.headerWrapper}>
			<div className={styles.header}>
				<div className={styles.titleWrapper}>
					{renderHeaderLogo()}
					{title && (
						<>
							<div className={styles.divider} />
							<span>{title}</span>
						</>
					)}
				</div>
				<div className={styles.linkWrapper}>
					<div className={styles.buttonWrapper}>
						<Button
							size={'small'}
							href={`https://github.com/redivis/geo-coverage#readme`}
							target={'_blank'}
						>
							{'Documentation'}
						</Button>
					</div>
					<div className={styles.buttonWrapper}>
						{!isUserAuthorized && (
							<Button size={'small'} variant={'contained'} color={'primary'} onClick={onAuthorize}>
								{'Sign in to Redivis'}
							</Button>
						)}
						{isUserAuthorized && (
							<Button size={'small'} onClick={onDeauthorize}>
								{'Sign out'}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
